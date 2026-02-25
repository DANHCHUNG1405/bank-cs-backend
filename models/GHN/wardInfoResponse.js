WardResponse = {
    id: Int8Array,
    name_extension: String,
    name: String,
    district_id: Int8Array,
    created_by: String,  
}
var WardResponse = function (data, host) {
    this.id = data.WardCode;
    this.ward_code = data.WardCode;
    this.name = data.WardName;
    this.name_extension = data.NameExtension;
    this.district_id = data.DistrictID;
    this.created_date= data.CreatedDate;
}
module.exports = WardResponse
