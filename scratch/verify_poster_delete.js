const mongoose = require('mongoose');

async function testPosterDeletion() {
  await mongoose.connect('mongodb://localhost:27017/myreno');
  const Poster = mongoose.model('Poster', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  // 1. Get user
  const user = await User.findOne({ email: 'krishnabharathi35@gmail.com' });
  console.log('User found:', user.name, user._id.toString());

  // 2. Create a disposable test poster
  const testPoster = await Poster.create({
    user_id: user._id,
    posterId: 'POS-TEST-DISPOSABLE',
    poster_name: 'Disposable Test Poster For Verification',
    poster_title: 'DISPOSABLE TEST',
    product_name: 'Test Product',
    template: 'frame1',
    is_active: true
  });
  console.log('1. Created disposable test poster:', testPoster._id.toString(), testPoster.posterId);

  // 3. Obtain a fresh JWT token for this user
  // Let's call the auth service or sign token with JWT secret
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random-at-least-32-chars';
  // Let's check what secret the backend uses
  const token = jwt.sign(
    {
      _id: user._id.toString(),
      authId: user.authId,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // 4. Test DELETE /api/posters/deletePoster/:id with no body (the exact previous failing case)
  let res = await fetch(`http://localhost:6003/api/posters/deletePoster/${testPoster._id.toString()}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'app-code': 'renote'
    }
  });
  let data = await res.json();
  console.log('2. DELETE without request body response:', res.status, data);

  // 5. Verify the poster is deleted from database
  const checkDeleted = await Poster.findById(testPoster._id);
  console.log('3. Verification in DB - exists after delete?', checkDeleted !== null);

  // 6. Test deleting with an invalid/non-existent ID
  res = await fetch(`http://localhost:6003/api/posters/deletePoster/000000000000000000000000`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'app-code': 'renote'
    }
  });
  data = await res.json();
  console.log('4. Non-existent ID delete response:', res.status, data);

  // 7. Verify real user posters remain intact
  const realPosters = await Poster.find({ user_id: user._id });
  console.log('5. Real user posters remaining in DB:', realPosters.map(p => ({ id: p._id.toString(), posterId: p.posterId, name: p.poster_name })));

  await mongoose.disconnect();
}

testPosterDeletion().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
