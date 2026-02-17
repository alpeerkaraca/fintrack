package com.alpeerkaraca.fintrackserver.model;

public enum Category {
    HOUSING("Housing", "fa-solid fa-house"),
    UTILITIES("Utilities", "fa-solid fa-bolt"),
    FOOD("Food", "fa-solid fa-utensils"),
    SHOPPING("Shopping", "fa-solid fa-cart-shopping"),
    TRANSPORT("Transport", "fa-solid fa-car"),
    GROCERY("Grocery", "fa-solid fa-basket-shopping"),
    TRAVEL("Travel", "fa-solid fa-plane"),
    ENTERTAINMENT("Entertainment", "fa-solid fa-film"),
    HEALTH("Health", "fa-solid fa-heart-pulse"),
    EDUCATION("Education", "fa-solid fa-graduation-cap"),
    PERSONAL_CARE("Personal Care", "fa-solid fa-spa"),
    INVESTMENT("Investment", "fa-solid fa-chart-line"),
    DEBT_PAYING("Debt Paying", "fa-solid fa-credit-card"),
    BILLS("Bills", "fa-solid fa-file-invoice-dollar"),
    SAVINGS("Savings", "fa-solid fa-piggy-bank"),
    RENT("Rent", "fa-solid fa-building"),
    INCOME("Income", "fa-solid fa-money-bill-wave"),
    ELECTRONICS("Electronics", "fa-solid fa-tv"),
    SALARY("Salary", "fa-solid fa-sack-dollar"),
    DINING("Dining", "fa-solid fa-utensils"),
    OTHER("Other", "fa-solid fa-ellipsis");

    private final String label;
    private final String icon;

    Category(String label, String icon) {
        this.label = label;
        this.icon = icon;
    }

    public String getLabel() {
        return label;
    }

    public String getIcon() {
        return icon;
    }


}
