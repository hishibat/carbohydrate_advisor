export interface NutritionData {
  food_items: string[];
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  salt: number;
  advice: string;
  eating_order: string[];
}

export interface MealTarget {
  min: number;
  max: number;
  unit: string;
  note?: string;
  visual_guide?: string;
}

export interface EatingOrderStep {
  order: number;
  category: string;
  examples: string;
  effect: string;
}

export interface RiceReference {
  name: string;
  rice_g: number;
  carbs_g: number;
  onigiri?: string;
}

export interface ProteinReference {
  name: string;
  calories: number;
  protein_g: number;
  salt_g: number;
}

export interface FiberReference {
  name: string;
  amount_g: number;
  fiber_g: number;
}

export interface NutritionStandards {
  source: string;
  daily_targets: {
    calories: { min: number; max: number; unit: string; note?: string };
    carbs: { min: number; max: number; unit: string; note?: string };
    protein: { min: number; max: number; unit: string; note?: string };
    fat: { min: number; max: number; unit: string };
    fiber: { min: number; max: number; unit: string };
    vegetables: { min: number; max: number; unit: string; note?: string };
    salt: { min: number; max: number; unit: string };
    fruit?: { note: string };
    snacks?: { max: number; unit: string; note: string };
  };
  meal_targets: {
    description: string;
    carbs: MealTarget;
    protein: MealTarget;
    fat: MealTarget;
    fiber?: MealTarget;
    vegetables?: MealTarget;
    salt?: MealTarget;
  };
  eating_order: {
    title: string;
    steps: EatingOrderStep[];
  };
  advice: {
    carbs_tips: string[];
    protein_tips: string[];
    timing_tips: string[];
    general_tips: string[];
    calorie_cut_tips: string[];
  };
  rice_reference: {
    title: string;
    items: RiceReference[];
  };
  protein_reference: {
    title: string;
    items: ProteinReference[];
  };
  fiber_reference: {
    title: string;
    items: FiberReference[];
  };
}
