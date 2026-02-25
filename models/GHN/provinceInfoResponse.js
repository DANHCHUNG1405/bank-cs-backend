ProvinceResponse = {
    id: Int8Array,
    name_extension: String,
    name: String,
    created_by: String,
  
}
var ProvinceResponse = function (data, host) {
    this.id = data.ProvinceID;
    this.name = data.ProvinceName;
    this.name_extension = data.NameExtension;
    this.created_date= data.CreatedAt;
   

}
module.exports = ProvinceResponse