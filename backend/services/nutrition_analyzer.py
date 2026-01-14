import google.generativeai as genai
from PIL import Image
import io
import json
import re
from typing import Optional
from pydantic import BaseModel


class NutritionData(BaseModel):
    """栄養素データモデル"""
    food_items: list[str]  # 認識した食品リスト
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
    "calories": 数値,
    "carbs": 数値,
    "protein": 数値,
    "fat": 数値,
    "fiber": 数値,
    "salt": 数値,
    "advice": "糖質制限中の方へのアドバイス文",
    "eating_order": ["最初に食べるべき食品", "次に食べるべき食品", ...]
}

注意事項:
- calories: 推定総カロリー（kcal）
- carbs: 糖質量（g）- 炭水化物から食物繊維を引いた値
- protein: たんぱく質量（g）
- fat: 脂質量（g）
- fiber: 食物繊維量（g）
- salt: 塩分量（g）
- advice: 糖質制限が必要な方向けの具体的なアドバイス（血糖値の上昇を緩やかにする食べ方など）
- eating_order: 血糖値の急上昇を防ぐための推奨される食べる順番（野菜→タンパク質→炭水化物の順が基本）

画像に食事が写っていない場合は、food_itemsを空配列にして、adviceに「食事の画像をアップロードしてください」と記載してください。
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

        return NutritionData(
            food_items=data.get("food_items", []),
            calories=float(data.get("calories", 0)),
            carbs=float(data.get("carbs", 0)),
            protein=float(data.get("protein", 0)),
            fat=float(data.get("fat", 0)),
            fiber=float(data.get("fiber", 0)),
            salt=float(data.get("salt", 0)),
            advice=data.get("advice", ""),
            eating_order=data.get("eating_order", [])
        )
