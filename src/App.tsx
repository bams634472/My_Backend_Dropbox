import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import FileUploader from './components/FileUploader';
import './App.css';

Amplify.configure(outputs);

function App() {
  return (
    <div className="app-container">
      <h1 style={{ marginBottom: '30px' }}>Serverless Dropbox</h1>
      <FileUploader />
    </div>
  );
}

export default App;