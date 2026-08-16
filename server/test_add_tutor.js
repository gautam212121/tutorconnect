import FormData from 'form-data';
import axios from 'axios';

async function test() {
  try {
    const formData = new FormData();
    formData.append('name', 'Test Tutor');
    formData.append('email', 'testtutor123@example.com');
    formData.append('password', 'password123');
    formData.append('mobile', '1234567890');
    formData.append('location', 'LUCKNOW');
    formData.append('headline', 'Tutor');
    formData.append('experience', '2 year');
    formData.append('role', 'tutor');
    formData.append('status', 'verified');
    formData.append('verified', 'true');
    formData.append('subjects', JSON.stringify(['Mathmatics', 'physics']));
    formData.append('price', '300');
    formData.append('mode', JSON.stringify(['Online']));
    formData.append('rating', '4.7');
    formData.append('reviews', '14');

    const res = await axios.post('http://localhost:5000/api/v1/admin-new/test-users', formData, {
      headers: formData.getHeaders()
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
