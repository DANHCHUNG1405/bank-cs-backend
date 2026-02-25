
SearchViewModel = {
    page: String,
    size: Number,
    searchModel: Object,
    StoreId: Object,
    CategoryId: Object
}

var SearchViewModel = function (page, size, searchModel) {
    this.page = page;
    this.size = size;
    this.searchModel = searchModel;
}

module.exports = SearchViewModel;