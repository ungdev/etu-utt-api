export default class AssoPresident {
  role: AssoPresident_Role;
  user: AssoPresident_User;
}

class AssoPresident_Role {
  id: string;
  name: string;
}

class AssoPresident_User {
  firstName: string;
  lastName: string;
}
