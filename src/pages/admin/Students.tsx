import { useEffect, useState } from "react";
import API_BASE_URL from "../../services/api";

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
}

function Students() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("careeriq_token");

    fetch(`${API_BASE_URL}/profile/students`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <div className="page-container">
      <h1>Students</h1>
      <p>View registered students.</p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.role}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <p>No student data available.</p>
        )}
      </div>
    </div>
  );
}

export default Students;