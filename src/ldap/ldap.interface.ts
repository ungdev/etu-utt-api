export type LdapUser =
  | (LdapUserGeneric & LdapUserStudent)
  | (LdapUserGeneric & LdapUserEmployees)
  | (LdapUserGeneric & LdapUserAsso);

export const enum LdapAccountGroup {
  EMPLOYEES = '5000',
  ASSOCIATIONS = '6000',
  STUDENTS = '10000',
}

interface LdapUserGeneric {
  /** User uid. This is the identifier used to login with the CAS */
  uid: string;
  /** Users's first name */
  givenName: string;
  /** User's last name */
  sn: string;
  /** User's email adress. Domain is always utt.fr */
  mail: string;
  /**
   * Groups the User is member of.
   * Any staff member will be either in `employee` or `faculty`
   * Any EPF student will be in `epf`
   * Any student will be in `student`
   */
  eduPersonAffiliation: string[] | string;
  /** The scheduled date of the end of the account (YYYYMMDD) */
  datefin: string;
}

interface LdapUserStudent {
  gidNumber: LdapAccountGroup.STUDENTS;
  /** Student number */
  supannEtuId: string;
  /** INE Number */
  supannCodeINE: string;
  /** Type of 'employee' */
  employeeType: 'student';
  /** Name of the curriculum(s), eg. `Ingénieur` or `Master Sciences et Technologies` */
  formation: string[] | string;
  /** Branch and semester eg. `RT2` */
  niveau: string[] | string;
  /** Branch option eg. `LET` or `SSC`. `NC` if no option yet */
  filiere: string[] | string;
  /** Link to jpeg photograph of the user */
  jpegPhoto: string;
  /** List of this semester's UEs */
  uv: string[] | string;
}

interface LdapUserEmployees {
  gidNumber: LdapAccountGroup.EMPLOYEES;
  /** Telephone number of the office */
  telephonenumber: string;
  /** Office location */
  roomNumber: string;
  /** Title of the User eg. `ENSEIGNANT(E)` or `APPRENTI(E)` */
  title: string;
}

interface LdapUserAsso {
  gidNumber: LdapAccountGroup.ASSOCIATIONS;
}
