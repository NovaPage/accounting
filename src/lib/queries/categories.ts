"use server";
import { CategoryService, CategoryOption } from "@/lib/services/category.service";

const categoryService = new CategoryService();

export { type CategoryOption };

export async function fetchCategories(spaceId: string): Promise<CategoryOption[]> {
    return categoryService.fetchCategories(spaceId);
}
