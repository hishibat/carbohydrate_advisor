import google.generativeai as genai
from PIL import Image
import io
import json
import re
from typing import Optional
from pydantic import BaseModel


class BoundingBox(BaseModel):
    """バウンディングボックス座標（正規化された0-1の値）"""
    x: float  # 左上X座標 (0-1)
    y: float  # 左上Y座標 (0-1)
    width: float  # 幅 (0-1)
    height: float  # 高さ (0-1)


class DetectedFood(BaseModel):
    """検出された食品とその位置情報"""
    name: str  # 食品名
    category: str  # カテゴリ: "carbs"(主食), "protein"(主菜), "vegetable"(副菜), "soup"(汁物), "other"(その他)
    carbs: float  # この食品の糖質量 (g)
    bounding_box: Optional[BoundingBox] = None  # バウンディングボックス座標


class NutritionData(BaseModel):
    """栄養素データモデル"""
    food_items: list[str]  # 認識した食品リスト（後方互換性のため維持）
    detected_foods: list[DetectedFood] = []  # 検出された食品の詳細情報
    calories: float  # カロリー (kcal)
    carbs: float  # 糖質 (g)
    protein: float  # たんぱく質 (g)
    fat: float  # 脂質 (g)
    fiber: float  # 食物繊維 (g)
    salt: float  # 塩分 (g)
    advice: str  # 食事アドバイス
    eating_order: list[str]  # 推奨される食べる順番


class NutritionAnalyzer:
    """Gemini APIを使用した栄養素分析サービス"""

    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    async def analyze_image(self, image_data: bytes) -> NutritionData:
        """
        食事画像を分析して栄養素データを返す

        Args:
            image_data: 画像のバイナリデータ

        Returns:
            NutritionData: 分析結果
        """
        image = Image.open(io.BytesIO(image_data))

        prompt = """
あなたは栄養士のAIアシスタントです。この食事画像を分析して、以下の情報をJSON形式で返してください。

必ず以下のJSON形式で回答してください（他のテキストは不要です）:
{
    "food_items": ["食品1", "食品2", ...],
    "detected_foods": [
        {
            "name": "食品名（日本語）",
            "category": "carbs|protein|vegetable|soup|other",
            "carbs": 糖質量(g),
            "bounding_box": {
                "x": 0.0-1.0,
                "y": 0.0-1.0,
                "width": 0.0-1.0,
                "height": 0.0-1.0
            }
        }
    ],
    "calories": 数値,
    "carbs": 数値,
    "protein": 数値,
    "fat": 数値,
    "fiber": 数値,
    "salt": 数値,
    "advice": "糖質制限中の方へのアドバイス文",
    "eating_order": ["最初に食べるべき食品", "次に食べるべき食品", ...]
}

detected_foodsの説明:
- name: 食品名（例：「ご飯」「鯖の味噌煮」「サラダ」）
- category: 食品カテゴリ
  - "carbs": 主食（ご飯、パン、麺類など）
  - "protein": 主菜（肉、魚、卵、大豆製品など）
  - "vegetable": 副菜（野菜、サラダ、漬物など）
  - "soup": 汁物（味噌汁、スープなど）
  - "other": その他
- carbs: この食品単体の推定糖質量（g）
- bounding_box: 画像内での食品の位置（正規化座標0.0〜1.0）
  - x: 左上のX座標（画像の左端が0、右端が1）
  - y: 左上のY座標（画像の上端が0、下端が1）
  - width: 幅（画像幅に対する割合）
  - height: 高さ（画像高さに対する割合）

注意事項:
- calories: 推定総カロリー（kcal）
- carbs: 糖質量（g）- 炭水化物から食物繊維を引いた値
- protein: たんぱく質量（g）
- fat: 脂質量（g）
- fiber: 食物繊維量（g）
- salt: 塩分量（g）
- advice: 糖質制限が必要な方向けの具体的なアドバイス（血糖値の上昇を緩やかにする食べ方など）
- eating_order: 血糖値の急上昇を防ぐための推奨される食べる順番（野菜→タンパク質→炭水化物の順が基本）

画像に食事が写っていない場合は、food_itemsとdetected_foodsを空配列にして、adviceに「食事の画像をアップロードしてください」と記載してください。
"""

        response = self.model.generate_content([prompt, image])

        return self._parse_response(response.text)

    def _parse_response(self, response_text: str) -> NutritionData:
        """
        Geminiのレスポンスをパースしてモデルに変換
        """
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            return NutritionData(
                food_items=[],
                detected_foods=[],
                calories=0,
                carbs=0,
                protein=0,
                fat=0,
                fiber=0,
                salt=0,
                advice="画像の分析に失敗しました。別の画像をお試しください。",
                eating_order=[]
            )

        data = json.loads(json_match.group())

        # detected_foods をパース
        detected_foods = []
        for food_data in data.get("detected_foods", []):
            bbox_data = food_data.get("bounding_box")
            bbox = None
            if bbox_data:
                bbox = BoundingBox(
                    x=float(bbox_data.get("x", 0)),
                    y=float(bbox_data.get("y", 0)),
                    width=float(bbox_data.get("width", 0)),
                    height=float(bbox_data.get("height", 0))
                )
            detected_foods.append(DetectedFood(
                name=food_data.get("name", ""),
                category=food_data.get("category", "other"),
                carbs=float(food_data.get("carbs", 0)),
                bounding_box=bbox
            ))

        return NutritionData(
            food_items=data.get("food_items", []),
            detected_foods=detected_foods,
            calories=float(data.get("calories", 0)),
            carbs=float(data.get("carbs", 0)),
            protein=float(data.get("protein", 0)),
            fat=float(data.get("fat", 0)),
            fiber=float(data.get("fiber", 0)),
            salt=float(data.get("salt", 0)),
            advice=data.get("advice", ""),
            eating_order=data.get("eating_order", [])
        )
