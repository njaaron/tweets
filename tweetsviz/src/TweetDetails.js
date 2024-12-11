const TweetDetails = ({ tweets }) => {
    return (
      <div style={{ marginTop: "20px" }}>
        <h3>Selected Tweets</h3>
        <ul>
          {tweets.map((tweet) => (
            <li key={tweet.idx}>{tweet.RawTweet}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default TweetDetails;
  