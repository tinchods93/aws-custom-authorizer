import fs from 'fs';
import path from 'path';

interface iInput {
  testName: string;
  payload: any;
  testType?: 'COMPARE' | 'TEST';
}
const outputTestResponse = ({ testName, payload, testType }: iInput) => {
  const folderPath = `./outputs${
    testType === 'COMPARE' ? '/regression' : '/tests'
  }`;

  fs.writeFileSync(
    path.resolve(__dirname, `${folderPath}/${testName ?? 'test'}_output.json`),
    JSON.stringify(payload, null, 2)
  );
};

export default outputTestResponse;
