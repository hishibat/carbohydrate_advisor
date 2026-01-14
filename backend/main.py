from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from services import NutritionAnalyzer, NutritionData

app = FastAPI(
    title="糖質管理アドバイザー API",
    description="食事画像から栄養素を分析し、糖質制限のアドバイスを提供するAPI",
    version="1.0.0"
)

settings = get_settings()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """ヘルスチェック"""
    return {"status": "healthy", "message": "糖質管理アドバイザー API"}


@app.post("/api/analyze", response_model=NutritionData)
async def analyze_meal(file: UploadFile = File(...)):
    """
    食事画像を分析して栄養素データとアドバイスを返す

    - **file**: 食事の画像ファイル（JPEG, PNG）
    """
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API Keyが設定されていません"
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="画像ファイルをアップロードしてください"
        )

    image_data = await file.read()

    if len(image_data) > 10 * 1024 * 1024:  # 10MB制限
        raise HTTPException(
            status_code=400,
            detail="ファイルサイズは10MB以下にしてください"
        )

    analyzer = NutritionAnalyzer(settings.gemini_api_key)
    result = await analyzer.analyze_image(image_data)

    return result


@app.get("/api/standards")
async def get_nutrition_standards():
    """
    糖質制限者向けの栄養摂取基準値を返す

    医師提供資料「できることから始めよう 健康増進サポート」に基づく
    """
    return {
        "source": "医師提供資料「できることから始めよう 健康増進サポート」",
        "daily_targets": {
            "calories": {"min": 1400, "max": 2000, "unit": "kcal", "note": "活動量により調整"},
            "carbs": {"min": 130, "max": 165, "unit": "g", "note": "主食は握りこぶし×3食分"},
            "protein": {"min": 50, "max": 75, "unit": "g", "note": "片手のひら程度×3食分"},
            "fat": {"min": 40, "max": 65, "unit": "g"},
            "fiber": {"min": 18, "max": 25, "unit": "g"},
            "vegetables": {"min": 350, "max": 400, "unit": "g", "note": "1/3緑黄色、2/3淡色野菜"},
            "salt": {"min": 0, "max": 6, "unit": "g"},
            "fruit": {"note": "握りこぶし1個分、日中に摂取"},
            "snacks": {"max": 100, "unit": "kcal", "note": "15時までに"}
        },
        "meal_targets": {
            "description": "1食あたりの目安（医師推奨）",
            "carbs": {
                "min": 40, "max": 55, "unit": "g",
                "note": "主食は握りこぶし程度（ご飯約150g）",
                "visual_guide": "握りこぶし"
            },
            "protein": {
                "min": 15, "max": 25, "unit": "g",
                "note": "片手のひら程度（大豆製品は2倍量OK）",
                "visual_guide": "指を含まない片手のひら"
            },
            "fat": {"min": 10, "max": 20, "unit": "g"},
            "fiber": {"min": 6, "max": 8, "unit": "g"},
            "vegetables": {
                "min": 120, "max": 150, "unit": "g",
                "note": "数値が高めの方は多めに"
            },
            "salt": {"min": 0, "max": 2, "unit": "g"}
        },
        "eating_order": {
            "title": "血糖値スパイクを防ぐ食べ順（ベジファースト）",
            "steps": [
                {
                    "order": 1,
                    "category": "副菜（食物繊維）",
                    "examples": "野菜、サラダ、海藻、きのこ",
                    "effect": "食物繊維が糖の吸収を穏やかにし、満腹中枢を刺激"
                },
                {
                    "order": 2,
                    "category": "主菜（たんぱく質）",
                    "examples": "肉、魚、卵、大豆製品",
                    "effect": "血糖値の上昇を緩やかに"
                },
                {
                    "order": 3,
                    "category": "主食（炭水化物）",
                    "examples": "ご飯、パン、麺類",
                    "effect": "最後に食べることで血糖値の急上昇を抑制"
                }
            ]
        },
        "advice": {
            "carbs_tips": [
                "精製度の低いものを選ぶ（雑穀米など）で食後血糖値が上がりにくい",
                "遅い時間帯は主食の量を減らす（脂肪になりやすい）",
                "主菜・副菜に糖質が多い場合（イモ類など）は主食を減らす",
                "揚げ物など脂質が多い場合も主食を減らす"
            ],
            "protein_tips": [
                "3食ごとに適量摂る（まとめ食べはNG）",
                "脂質の少ない部位を選ぶ（豚バラより豚ロース）",
                "魚や大豆製品を組み合わせる（血栓リスク低減）",
                "脂身や皮を除くとカロリーカット"
            ],
            "timing_tips": [
                "1日3食規則正しく（欠食は血糖値スパイクの原因）",
                "夕食が遅くなる場合は分食を（夕方に炭水化物、遅い時間におかずのみ）",
                "寝る直前は炭水化物を減らし、脂質控えめの消化の良いものを",
                "果物は代謝が下がる夕方以降を避けて日中に"
            ],
            "general_tips": [
                "よく噛んでゆっくり食べる",
                "食後10分程度の軽い運動（散歩やスクワット）で血糖上昇を抑制",
                "水分は1日2リットルを目安に",
                "お菓子は1日100kcal以内、15時までに",
                "飲み物は無糖・カロリーゼロを選択"
            ],
            "calorie_cut_tips": [
                "ロース肉の脂身をとる: -61kcal",
                "鶏もも肉の皮をとる: -77kcal",
                "ひき肉料理は高カロリー（脂身が混入）に注意",
                "調理法で差: チキンカツ(428kcal)→から揚げ(357kcal)→焼き鳥(234kcal)→蒸し鶏(154kcal)"
            ]
        },
        "rice_reference": {
            "title": "ご飯の量の目安（コンビニおにぎり換算）",
            "items": [
                {"name": "コンビニおにぎり1個", "rice_g": 100, "carbs_g": 37},
                {"name": "カレーライス（普通）", "rice_g": 300, "carbs_g": 111, "onigiri": "3個分"},
                {"name": "カレーライス（大盛）", "rice_g": 400, "carbs_g": 148, "onigiri": "4個分"},
                {"name": "丼もの（普通）", "rice_g": 260, "carbs_g": 96, "onigiri": "2.6個分"},
                {"name": "丼もの（大盛）", "rice_g": 320, "carbs_g": 118, "onigiri": "3.2個分"},
                {"name": "推奨（握りこぶし）", "rice_g": 150, "carbs_g": 55, "onigiri": "1.5個分"}
            ]
        },
        "protein_reference": {
            "title": "市販のたんぱく質食材（100gあたり）",
            "items": [
                {"name": "ツナ缶（水煮）", "calories": 71, "protein_g": 16.0, "salt_g": 0.5},
                {"name": "サラダチキン", "calories": 107, "protein_g": 24.3, "salt_g": 1.1},
                {"name": "サケ缶（水煮）", "calories": 170, "protein_g": 21.2, "salt_g": 0.6},
                {"name": "サバ缶（水煮）", "calories": 190, "protein_g": 20.9, "salt_g": 0.9},
                {"name": "焼き魚（ほっけ）", "calories": 200, "protein_g": 23.1, "salt_g": 2.0}
            ]
        },
        "fiber_reference": {
            "title": "食物繊維を多く含む食品（1食あたり）",
            "items": [
                {"name": "おから", "amount_g": 50, "fiber_g": 5.8},
                {"name": "ひじき", "amount_g": 70, "fiber_g": 2.8},
                {"name": "ブロッコリー", "amount_g": 60, "fiber_g": 2.6},
                {"name": "ほうれん草", "amount_g": 70, "fiber_g": 2.0}
            ]
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
