import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Nom du rôle (ex: "Super Admin")
  permissions: [{ type: String }], // Permissions (ex: ["create", "read", "update", "delete"])
});



const Role = mongoose.model('Role', roleSchema);

export default Role;
