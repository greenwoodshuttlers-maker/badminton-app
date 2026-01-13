import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useEffect, useState } from "react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(list);
  };

  const changeRole = async (id, role) => {
    await updateDoc(doc(db, "users", id), { role });
    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div>
      <h3>User Management</h3>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Change Role</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {u.role !== "SUPER_ADMIN" && (
                  <>
                    <button onClick={() => changeRole(u.id, "PLAYER")}>PLAYER</button>
                    <button onClick={() => changeRole(u.id, "ADMIN")}>ADMIN</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
