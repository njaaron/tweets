// Dropdown.js
const Dropdown = ({ colorBy, setColorBy }) => {
    return (
      <div>
        <label htmlFor="colorBy">Color By: </label>
        <select
          id="colorBy"
          value={colorBy}
          onChange={(e) => setColorBy(e.target.value)}
        >
          <option value="Sentiment">Sentiment</option>
          <option value="Subjectivity">Subjectivity</option>
        </select>
      </div>
    );
  };
  
  export default Dropdown;