DistrictResponse = {
    id: Int8Array,
    name_extension: String,
    name: String,
    province_id: Int8Array,
    created_by: String,  
}
var DistrictResponse = function (data, host) {
    this.id = data.DistrictID;
    this.name = data.DistrictName;
    this.name_extension = data.NameExtension;
    this.province_id = data.ProvinceID;
    this.created_date= data.CreatedAt;
}
module.exports = DistrictResponse
 