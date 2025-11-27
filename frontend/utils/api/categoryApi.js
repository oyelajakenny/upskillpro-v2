import { api } from "../api.js";

/**
 * Fetch all categories from the API
 * @param {string} token - Optional authentication token
 * @returns {Promise<Array>} Array of category objects
 */
export async function fetchCategories(token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(api("/categories"), {
      method: "GET",
      headers,
      credentials: "include",
    });

    // Handle 404 as empty array (no categories yet)
    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      let errorMessage = "Failed to fetch categories";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

/**
 * Get a single category by ID
 * @param {string} categoryId - The category ID to fetch
 * @param {string} token - Optional authentication token
 * @returns {Promise<Object>} Category object
 */
export async function getCategoryById(categoryId, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(api(`/categories/${categoryId}`), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to fetch category");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
}
