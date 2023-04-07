import fs from "fs";
import { faker } from '@faker-js/faker/locale/de';

const writeStream = fs.createWriteStream("./data/import.csv");

writeStream.write('name email age salary isActive\n');

for (let index = 0; index < 10000; index++) {
   const firstName = faker.name.firstName();
   const email = faker.internet.email(firstName);
   const age = faker.datatype.number({ min: 18, max: 65 });
   const salary = faker.random.numeric(4, { allowLeadingZeros: true });
   const isActive = faker.datatype.boolean();

   const arr = [firstName, email, age, salary, isActive];
   writeStream.write(arr.join(' ') + '\n');
}

export { };