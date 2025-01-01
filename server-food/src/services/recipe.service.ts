import { Recipe, Ingredient } from '../models/Recipe';
import { DietaryService } from './dietary.service';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../config/redis';
import axios from 'axios';

interface RecipeAnalysis {
  nutritionScore: number;
  costEfficiency: number;
  complexity: number;
  timeEfficiency: number;
  sustainability: number;
  seasonality: number;
  recommendations: string[];
}

class RecipeService {
  private readonly CACHE_KEY = 'recipe:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private dietaryService: DietaryService;

  constructor() {
    this.dietaryService = new DietaryService();
  }

  async analyzeRecipe(recipeId: string): Promise<RecipeAnalysis> {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_KEY}analysis:${recipeId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }

      const analysis: RecipeAnalysis = {
        nutritionScore: this.calculateNutritionScore(recipe),
        costEfficiency: await this.calculateCostEfficiency(recipe),
        complexity: this.calculateComplexity(recipe),
        timeEfficiency: this.calculateTimeEfficiency(recipe),
        sustainability: await this.calculateSustainability(recipe),
        seasonality: await this.calculateSeasonality(recipe),
        recommendations: [],
      };

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis, recipe);

      // Cache the analysis
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analysis));

      return analysis;
    } catch (error) {
      console.error('Error analyzing recipe:', error);
      throw new AppError('Failed to analyze recipe', 500);
    }
  }

  async findSimilarRecipes(recipeId: string): Promise<Recipe[]> {
    try {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }

      // Find recipes with similar characteristics
      const similarRecipes = await Recipe.find({
        _id: { $ne: recipeId },
        $or: [
          { cuisine: { $in: recipe.cuisine } },
          { category: { $in: recipe.category } },
          { 'nutrition.perServing.calories': {
            $gte: recipe.nutrition.perServing.calories * 0.8,
            $lte: recipe.nutrition.perServing.calories * 1.2,
          }},
        ],
      })
        .limit(5)
        .sort({ 'ratings.average': -1 });

      return similarRecipes;
    } catch (error) {
      console.error('Error finding similar recipes:', error);
      throw new AppError('Failed to find similar recipes', 500);
    }
  }

  async getRecipeVariations(
    recipeId: string,
    dietaryProfile: any
  ): Promise<Recipe[]> {
    try {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }

      const variations: Recipe[] = [];

      // Create variations based on dietary requirements
      if (dietaryProfile.dietaryType.includes('vegan') && !recipe.dietaryInfo.isVegan) {
        variations.push(await this.createVeganVariation(recipe));
      }

      if (dietaryProfile.dietaryType.includes('gluten-free') && !recipe.dietaryInfo.isGlutenFree) {
        variations.push(await this.createGlutenFreeVariation(recipe));
      }

      // Create variations based on health conditions
      if (dietaryProfile.healthConditions.includes('diabetes')) {
        variations.push(await this.createLowGlycemicVariation(recipe));
      }

      return variations;
    } catch (error) {
      console.error('Error getting recipe variations:', error);
      throw new AppError('Failed to get recipe variations', 500);
    }
  }

  async optimizeRecipe(
    recipeId: string,
    criteria: {
      maxCost?: number;
      maxTime?: number;
      nutritionTargets?: any;
      sustainabilityPreference?: boolean;
    }
  ): Promise<Recipe> {
    try {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }

      let optimizedRecipe = { ...recipe.toObject() };

      // Optimize for cost if needed
      if (criteria.maxCost && recipe.estimatedCost.total > criteria.maxCost) {
        optimizedRecipe = await this.optimizeForCost(optimizedRecipe, criteria.maxCost);
      }

      // Optimize for time if needed
      if (criteria.maxTime && recipe.totalTime > criteria.maxTime) {
        optimizedRecipe = this.optimizeForTime(optimizedRecipe, criteria.maxTime);
      }

      // Optimize for nutrition if targets provided
      if (criteria.nutritionTargets) {
        optimizedRecipe = await this.optimizeForNutrition(
          optimizedRecipe,
          criteria.nutritionTargets
        );
      }

      // Optimize for sustainability if preferred
      if (criteria.sustainabilityPreference) {
        optimizedRecipe = await this.optimizeForSustainability(optimizedRecipe);
      }

      return optimizedRecipe;
    } catch (error) {
      console.error('Error optimizing recipe:', error);
      throw new AppError('Failed to optimize recipe', 500);
    }
  }

  private calculateNutritionScore(recipe: any): number {
    const weights = {
      proteinBalance: 0.3,
      carbBalance: 0.2,
      fatBalance: 0.2,
      fiberContent: 0.15,
      vitaminContent: 0.15,
    };

    let score = 0;

    // Calculate protein balance
    const proteinCalories = recipe.nutrition.perServing.protein * 4;
    const totalCalories = recipe.nutrition.perServing.calories;
    const proteinPercentage = proteinCalories / totalCalories;
    score += weights.proteinBalance * (proteinPercentage >= 0.15 && proteinPercentage <= 0.35 ? 1 : 0.5);

    // Similar calculations for other nutrients...

    return score;
  }

  private async calculateCostEfficiency(recipe: any): Promise<number> {
    const nutritionValue = this.calculateNutritionScore(recipe);
    return nutritionValue / recipe.estimatedCost.perServing;
  }

  private calculateComplexity(recipe: any): number {
    return (
      recipe.ingredients.length * 0.3 +
      recipe.steps.length * 0.4 +
      recipe.steps.reduce((acc: number, step: any) => acc + (step.techniques?.length || 0), 0) * 0.3
    ) / 10;
  }

  private calculateTimeEfficiency(recipe: any): number {
    const complexityScore = this.calculateComplexity(recipe);
    return recipe.totalTime / (complexityScore * 60);
  }

  private async calculateSustainability(recipe: any): Promise<number> {
    // Implementation would involve checking ingredients against sustainability database
    return 0.8;
  }

  private async calculateSeasonality(recipe: any): Promise<number> {
    // Implementation would involve checking ingredients against seasonal database
    return 0.7;
  }

  private generateRecommendations(analysis: RecipeAnalysis, recipe: any): string[] {
    const recommendations: string[] = [];

    if (analysis.nutritionScore < 0.6) {
      recommendations.push('Consider adding more protein-rich ingredients');
    }

    if (analysis.costEfficiency < 0.5) {
      recommendations.push('Try substituting some ingredients with more cost-effective alternatives');
    }

    if (analysis.complexity > 0.8) {
      recommendations.push('Recipe could be simplified by combining some steps');
    }

    return recommendations;
  }

  private async createVeganVariation(recipe: any): Promise<Recipe> {
    // Implementation of vegan variation creation
    return recipe;
  }

  private async createGlutenFreeVariation(recipe: any): Promise<Recipe> {
    // Implementation of gluten-free variation creation
    return recipe;
  }

  private async createLowGlycemicVariation(recipe: any): Promise<Recipe> {
    // Implementation of low glycemic variation creation
    return recipe;
  }

  private async optimizeForCost(recipe: any, maxCost: number): Promise<Recipe> {
    // Implementation of cost optimization
    return recipe;
  }

  private optimizeForTime(recipe: any, maxTime: number): Recipe {
    // Implementation of time optimization
    return recipe;
  }

  private async optimizeForNutrition(recipe: any, targets: any): Promise<Recipe> {
    // Implementation of nutrition optimization
    return recipe;
  }

  private async optimizeForSustainability(recipe: any): Promise<Recipe> {
    // Implementation of sustainability optimization
    return recipe;
  }
}

export { RecipeService, RecipeAnalysis };
