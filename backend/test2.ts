import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/ds-engine-osys').then(async () => {
  const hrUser = await mongoose.connection.collection('hrs').findOne({ role: 'hr', status: 'approved' });
  const query = { accountStatus: { $in: ['Pending', 'Denied'] }, departmentId: hrUser.departmentId };
  if (hrUser.subDepartmentId) query.subDepartmentId = hrUser.subDepartmentId;
  const emps = await mongoose.connection.collection('employees').find(query).toArray();
  console.log('Emps found for HR query:', emps.length, JSON.stringify(emps, null, 2));
  process.exit(0);
});
