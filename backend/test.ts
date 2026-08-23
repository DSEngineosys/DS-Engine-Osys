import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/ds-engine-osys').then(async () => {
  const hrUser = await mongoose.connection.collection('hrs').findOne({ role: 'hr', status: 'approved' });
  console.log('HR User subDepartmentId type:', typeof hrUser.subDepartmentId, hrUser.subDepartmentId?.constructor.name, hrUser.subDepartmentId);
  const query = { accountStatus: { $in: ['Pending', 'Denied'] }, departmentId: hrUser.departmentId };
  if (hrUser.subDepartmentId) {
    query.subDepartmentId = hrUser.subDepartmentId;
  }
  const emps = await mongoose.connection.collection('employees').find(query).toArray();
  console.log('Found emps:', emps.length, emps);
  process.exit(0);
});
