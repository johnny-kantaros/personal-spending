EXCLUDE_CATEGORIES = ["LOAN_PAYMENTS", "INCOME", "TRANSFER_IN", "TRANSFER_OUT", "BANK_FEES"]

# Mapping from primary categories to simplified spending categories
CATEGORY_MAPPING = {
    "HOME_IMPROVEMENT": "Shopping",
    "TRANSPORTATION": "Transportation",
    "TRAVEL": "Travel",
    "RENT_AND_UTILITIES": "Bills & Utilities",
    "MEDICAL": "Personal Care",
    "ENTERTAINMENT": "Entertainment",
    "GENERAL_SERVICES": "Other",
    "GOVERNMENT_AND_NON_PROFIT": "Other",
    "LOAN_PAYMENTS": "Other",
}

# Detailed categories that map to Groceries
GROCERIES_CATEGORIES = [
    "FOOD_AND_DRINK_GROCERIES",
]

# Detailed categories that map to Gym & Activities
GYM_ACTIVITIES_CATEGORIES = [
    "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS",
    "GENERAL_MERCHANDISE_SPORTING_GOODS",
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

    # Special handling for Gym & Activities
    if detailed_category and detailed_category in GYM_ACTIVITIES_CATEGORIES:
        return "Gym & Activities"

    # GENERAL_MERCHANDISE - default to Shopping unless already handled above
    if primary_category == "GENERAL_MERCHANDISE":
        return "Shopping"

    # PERSONAL_CARE - default to Personal Care unless already handled above
    if primary_category == "PERSONAL_CARE":
        return "Personal Care"

    return CATEGORY_MAPPING.get(primary_category, "Other")