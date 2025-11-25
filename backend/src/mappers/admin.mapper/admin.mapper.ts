
import { IUserDocument } from "types/user.type";
import { AdminResponseDTO } from "../../dtos/admin.dtos/admin.dtos";

function mapAdminToResponse(user: IUserDocument): AdminResponseDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage || null,
    phone: user.phone || null,
  };
}

export default mapAdminToResponse;
