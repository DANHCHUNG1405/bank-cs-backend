// generate random code with prefix and padded id
const generateCode = (length, obj) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const id = obj.id.toString().padStart(7, "0");
  return result + id;
};

// generate transaction code
const generateCodeTransactionId = (length, obj) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const id = obj.user_id.toString().padStart(7, "0");
  return result + id;
};

// generate unique id with timestamp
const generateUniqueId = (prefix = "ID") => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${ts}${rand}`;
};

module.exports = { generateCode, generateCodeTransactionId, generateUniqueId };
