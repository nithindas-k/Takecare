 
  import { IUserDocument } from "../../types/user.type";
  import { UserResponseDTO } from "dtos/user.dtos/user.dto";


  
 
   function  mapUserToResponse  (user: IUserDocument): UserResponseDTO {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
    };
  }


  export default  mapUserToResponse