const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ds-engine-osys').then(async () => {
  const HR = mongoose.connection.collection('hrs');
  const result = await HR.updateMany(
    { role: 'hr', hrId: { $exists: false }, status: 'approved' },
    { $set: { hrId: 'EMP1001HR' } }
  );
  console.log(result);
  process.exit(0);
});
