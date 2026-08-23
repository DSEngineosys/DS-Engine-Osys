import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/ds-engine-osys').then(async () => {
  const hr = await mongoose.connection.collection('hrs').findOne({ role: 'hr' });
  if(hr && hr.subDepartmentId) {
    await mongoose.connection.collection('employees').updateOne(
      { accountStatus: 'Pending', subDepartmentId: { $exists: false } },
      { $set: { subDepartmentId: hr.subDepartmentId } }
    );
    console.log('Updated missing subDept');
  }
  process.exit(0);
});
