// FileUpload.js
import React, { Component } from "react";

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = { file: null };
  }

  handleFileSubmit = (event) => {
    event.preventDefault();
    const { file } = this.state;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const json = this.sliceJsonData(JSON.parse(text));
        this.props.set_data(json);
      };
      reader.readAsText(file);
    }
  };

  sliceJsonData = (data) => {
    return data.slice(0, 300);
  };

  render() {
    return (
      <div style={{ backgroundColor: "#f0f0f0", padding: 20 }}>
        <h2>Upload a JSON File</h2>
        <form onSubmit={this.handleFileSubmit}>
          <input
            type="file"
            accept=".json"
            onChange={(event) => this.setState({ file: event.target.files[0] })}
          />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
}

export default FileUpload;