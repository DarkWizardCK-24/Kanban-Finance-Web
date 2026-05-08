import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";
import { IdGenerator } from "./idGenerator";
import {
  calculateAge,
  type UserModel,
  userFromMap,
  userToMap,
} from "./models";

export const AuthService = {
  get currentUser(): User | null {
    return firebaseAuth.currentUser;
  },

  async register(input: {
    email: string;
    password: string;
    name: string;
    phone: string;
    dateOfBirth: Date;
  }): Promise<UserModel> {
    const cred = await createUserWithEmailAndPassword(
      firebaseAuth, input.email, input.password,
    );
    const userId = await IdGenerator.user();
    const now = new Date();
    const user: UserModel = {
      id: userId,
      uid: cred.user.uid,
      name: input.name,
      email: input.email,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      age: calculateAge(input.dateOfBirth),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(firestore, "users", cred.user.uid), userToMap(user));
    return user;
  },

  async login(email: string, password: string): Promise<UserModel> {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const snap = await getDoc(doc(firestore, "users", cred.user.uid));
    if (!snap.exists()) throw new Error("User profile not found");
    return userFromMap(snap.data());
  },

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
  },

  async getCurrentUserModel(): Promise<UserModel | null> {
    const u = firebaseAuth.currentUser;
    if (!u) return null;
    const snap = await getDoc(doc(firestore, "users", u.uid));
    if (!snap.exists()) return null;
    return userFromMap(snap.data());
  },

  async updateUser(user: UserModel): Promise<void> {
    await updateDoc(doc(firestore, "users", user.uid), userToMap(user));
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(firebaseAuth, email);
  },
};
