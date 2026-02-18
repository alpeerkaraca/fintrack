package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.frontend.CategoryResponse;
import com.alpeerkaraca.fintrackserver.dto.frontend.StockMarketResponse;
import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.Category;
import com.alpeerkaraca.fintrackserver.model.StockMarket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MetadataServiceTest {

    private MetadataService metadataService;

    @BeforeEach
    void setUp() {
        metadataService = new MetadataService();
    }

    @Test
    void shouldGetAllAvailableCategories() {
        List<CategoryResponse> categories = metadataService.getAvailableCategories();

        assertThat(categories).isNotNull();
        assertThat(categories).hasSize(Category.values().length);
    }

    @Test
    void shouldReturnCategoriesWithCorrectStructure() {
        List<CategoryResponse> categories = metadataService.getAvailableCategories();

        CategoryResponse foodCategory = categories.stream()
                .filter(c -> c.id().equals("FOOD"))
                .findFirst()
                .orElseThrow();

        assertThat(foodCategory.id()).isEqualTo("FOOD");
        assertThat(foodCategory.label()).isEqualTo("Food");
        assertThat(foodCategory.icon()).isEqualTo("fa-solid fa-utensils");
    }

    @Test
    void shouldIncludeAllExpectedCategories() {
        List<CategoryResponse> categories = metadataService.getAvailableCategories();

        List<String> categoryNames = categories.stream()
                .map(CategoryResponse::id)
                .toList();

        assertThat(categoryNames).contains(
                "HOUSING", "UTILITIES", "FOOD", "SHOPPING", "TRANSPORT",
                "GROCERY", "TRAVEL", "ENTERTAINMENT", "HEALTH", "EDUCATION",
                "PERSONAL_CARE", "INVESTMENT", "DEBT_PAYING", "BILLS",
                "SAVINGS", "RENT", "INCOME", "ELECTRONICS", "SALARY",
                "DINING", "OTHER"
        );
    }

    @Test
    void shouldGetAllAvailableStockMarkets() {
        List<StockMarketResponse> markets = metadataService.getAvailableMarkets();

        assertThat(markets).isNotNull();
        assertThat(markets).hasSize(StockMarket.values().length);
    }

    @Test
    void shouldReturnStockMarketsWithCorrectStructure() {
        List<StockMarketResponse> markets = metadataService.getAvailableMarkets();

        StockMarketResponse nasdaqMarket = markets.stream()
                .filter(m -> m.id().equals("NASDAQ"))
                .findFirst()
                .orElseThrow();

        assertThat(nasdaqMarket.id()).isEqualTo("NASDAQ");
        assertThat(nasdaqMarket.label()).isEqualTo("NASDAQ");
        assertThat(nasdaqMarket.currency()).isEqualTo("USD");
        assertThat(nasdaqMarket.supportedAssetTypes()).contains(AssetType.STOCK, AssetType.FUND);
    }

    @Test
    void shouldIncludeAllExpectedStockMarkets() {
        List<StockMarketResponse> markets = metadataService.getAvailableMarkets();

        List<String> marketIds = markets.stream()
                .map(StockMarketResponse::id)
                .toList();

        assertThat(marketIds).contains("BIST", "TEFAS", "NASDAQ", "NYSE", "OTHER");
    }

    @Test
    void shouldNotReturnNullOrEmptyCategories() {
        List<CategoryResponse> categories = metadataService.getAvailableCategories();

        assertThat(categories).isNotEmpty();
        assertThat(categories).doesNotContainNull();
        assertThat(categories).allMatch(c -> c.id() != null && !c.id().isEmpty());
        assertThat(categories).allMatch(c -> c.label() != null && !c.label().isEmpty());
        assertThat(categories).allMatch(c -> c.icon() != null && !c.icon().isEmpty());
    }

    @Test
    void shouldNotReturnNullOrEmptyStockMarkets() {
        List<StockMarketResponse> markets = metadataService.getAvailableMarkets();

        assertThat(markets).isNotEmpty();
        assertThat(markets).doesNotContainNull();
        assertThat(markets).allMatch(m -> m.id() != null && !m.id().isEmpty());
        assertThat(markets).allMatch(m -> m.label() != null && !m.label().isEmpty());
        assertThat(markets).allMatch(m -> m.currency() != null && !m.currency().isEmpty());
        assertThat(markets).allMatch(m -> m.supportedAssetTypes() != null && !m.supportedAssetTypes().isEmpty());
    }

    @Test
    void shouldReturnBISTWithCorrectCurrency() {
        List<StockMarketResponse> markets = metadataService.getAvailableMarkets();

        StockMarketResponse bist = markets.stream()
                .filter(m -> m.id().equals("BIST"))
                .findFirst()
                .orElseThrow();

        assertThat(bist.currency()).isEqualTo("TRY");
        assertThat(bist.supportedAssetTypes()).containsExactly(AssetType.STOCK);
    }

    @Test
    void shouldReturnTEFASWithFundSupport() {
        List<StockMarketResponse> markets = metadataService.getAvailableMarkets();

        StockMarketResponse tefas = markets.stream()
                .filter(m -> m.id().equals("TEFAS"))
                .findFirst()
                .orElseThrow();

        assertThat(tefas.currency()).isEqualTo("TRY");
        assertThat(tefas.supportedAssetTypes()).containsExactly(AssetType.FUND);
    }

    @Test
    void shouldReturnOtherWithCurrencyAndMetalSupport() {
        List<StockMarketResponse> markets = metadataService.getAvailableMarkets();

        StockMarketResponse other = markets.stream()
                .filter(m -> m.id().equals("OTHER"))
                .findFirst()
                .orElseThrow();

        assertThat(other.currency()).isEqualTo("TRY");
        assertThat(other.supportedAssetTypes()).contains(AssetType.CURRENCY, AssetType.GOLD_SILVER);
    }
}
