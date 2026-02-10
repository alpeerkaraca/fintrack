package com.alpeerkaraca.fintrackserver.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum MarketAssetType {
    GRAM_ALTIN("altin/gram-altin", "Gram Altın"),
    CEYREK_ALTIN("altin/ceyrek-altin", "Çeyrek Altın"),
    ONS_ALTIN("altin/altin-ons", "Ons Altın"),

    GUMUS_GRAM("emtia/gram-gumus", "Gümüş Gram");


    private final String slug;
    private final String label;

    MarketAssetType(String slug, String label) {
        this.slug = slug;
        this.label = label;
    }

     public static MarketAssetType fromSlug(String slug) {
        for (MarketAssetType type : values()) {
            if (type.slug.equalsIgnoreCase(slug)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unsupported market asset type: " + slug);
    }
}
