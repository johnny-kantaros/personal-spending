EXCLUDE_CATEGORIES = ["LOAN_PAYMENTS", "INCOME", "TRANSFER_IN", "TRANSFER_OUT", "BANK_FEES"]

# Mapping from primary categories to simplified spending categories
CATEGORY_MAPPING = {
    "GENERAL_MERCHANDISE": "Shopping",
    "HOME_IMPROVEMENT": "Shopping",
    "TRANSPORTATION": "Transportation",
    "TRAVEL": "Travel",
    "RENT_AND_UTILITIES": "Bills & Utilities",
    "MEDICAL": "Healthcare",
    "PERSONAL_CARE": "Healthcare",
    "ENTERTAINMENT": "Entertainment",
    "GENERAL_SERVICES": "Other",
    "GOVERNMENT_AND_NON_PROFIT": "Other",
    "LOAN_PAYMENTS": "Other",
}

# Detailed categories that map to Groceries
GROCERIES_CATEGORIES = [
    "FOOD_AND_DRINK_GROCERIES",
]

# Specific detailed categories to exclude (e.g., rent)
EXCLUDE_DETAILED_CATEGORIES = ["RENT_AND_UTILITIES_RENT"]

def get_simplified_category(primary_category: str, detailed_category: str = None) -> str:
    """
    Map a primary category to a simplified spending category.
    Returns 'Other' for unmapped categories.
    """
    # Check if detailed category should be excluded
    if detailed_category and detailed_category in EXCLUDE_DETAILED_CATEGORIES:
        return None

    # Check if primary category should be excluded entirely
    if primary_category in EXCLUDE_CATEGORIES:
        return None

    # Special handling for FOOD_AND_DRINK - split into Groceries vs Dining
    if primary_category == "FOOD_AND_DRINK":
        if detailed_category in GROCERIES_CATEGORIES:
            return "Groceries"
        else:
            return "Dining & Drinks"

    return CATEGORY_MAPPING.get(primary_category, "Other")