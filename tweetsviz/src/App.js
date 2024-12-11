import React, { Component } from "react";
import FileUpload from "./FileUpload";
import Dropdown from "./Dropdown";
import Visualization from "./Visualization";
import TweetDetails from "./TweetDetails";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      colorBy: "Sentiment",
      selectedTweets: [],
      fileUploaded: false, // New state to track file upload
    };
  }

  setData = (data) => {
    this.setState({ data, fileUploaded: true }); // Update fileUploaded to true
  };

  setColorBy = (colorBy) => {
    this.setState({ colorBy });
  };

  handleTweetSelection = (tweet) => {
    const { selectedTweets } = this.state;
    const isSelected = selectedTweets.find((t) => t.idx === tweet.idx);

    if (isSelected) {
      this.setState({
        selectedTweets: selectedTweets.filter((t) => t.idx !== tweet.idx),
      });
    } else {
      this.setState({ selectedTweets: [tweet, ...selectedTweets] });
    }
  };

  render() {
    const { data, colorBy, selectedTweets, fileUploaded } = this.state;

    return (
      <div>
        <FileUpload set_data={this.setData} />
        {fileUploaded && ( // Conditionally render components
          <>
            <Dropdown colorBy={colorBy} setColorBy={this.setColorBy} />
            <Visualization
              data={data}
              colorBy={colorBy}
              onTweetClick={this.handleTweetSelection}
            />
            <TweetDetails tweets={selectedTweets} />
          </>
        )}
      </div>
    );
  }
}

export default App;
