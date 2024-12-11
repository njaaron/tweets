import React, { Component } from "react";
import * as d3 from "d3";

class Visualization extends Component {
    constructor(props) {
        super(props);
        this.svgRef = React.createRef();
        this.state = {
            selectedTweets: [],
        };
    }

    componentDidMount() {
        this.createVisualization();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data || prevProps.colorBy !== this.props.colorBy) {
            this.createVisualization();
        }
    }

    sentimentColorScale = d3
        .scaleLinear()
        .domain([-1, 0, 1])
        .range(["red", "#ECECEC", "green"]);

    subjectivityColorScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range(["#ECECEC", "#4467C4"]);

    getColorScale = () =>
        this.props.colorBy === "Sentiment" ? this.sentimentColorScale : this.subjectivityColorScale;

    createSteppedColors(startColor, endColor, steps) {
        const scale = d3
            .scaleLinear()
            .domain([0, steps - 1])
            .range([startColor, endColor])
            .interpolate(d3.interpolateLab);
        const colors = [];
        for (let i = 0; i < steps; i++) {
            colors.push(scale(i));
        }
        return colors;
    }

    greenToNeutral = this.createSteppedColors("green", "#ECECEC", 11);
    neutralToRed = this.createSteppedColors("#ECECEC", "red", 10);
    sentimentColors = [...this.greenToNeutral, ...this.neutralToRed.slice(1)];
    subjectivityColors = this.createSteppedColors("#4467C4", "#ECECEC", 20);

    createVisualization() {
        const { data, colorBy } = this.props;

        const slicedData = data.slice(0, 300);

        const width = 1200;
        const height = 600;
        const margin = { top: 50, right: 150, bottom: 50, left: 100 };

        const svg = d3.select(this.svgRef.current)
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("*").remove();

        const months = ["March", "April", "May"];

        const yScale = d3
            .scaleBand()
            .domain(months)
            .range([margin.top, height - margin.bottom])
            .padding(0.3);

        const monthCounts = months.map(month => slicedData.filter(d => d.Month === month).length);
        const totalCount = d3.sum(monthCounts);

        const totalAvailableWidth = width - margin.left - margin.right;
        const desiredClusterTotalWidth = totalAvailableWidth;
        const monthWidths = monthCounts.map(count => (count / totalCount) * desiredClusterTotalWidth);

        const startX = margin.left;
        const shifts = { March: 200, April: -150, May: -400 };
        let cumulativeX = startX;

        const monthScales = {};
        for (let i = 0; i < months.length; i++) {
            const month = months[i];
            const monthData = slicedData.filter(d => d.Month === month);
            const dim1Values = monthData.map(d => d["Dimension 1"]);
            const dim1Min = d3.min(dim1Values);
            const dim1Max = d3.max(dim1Values);
            const dim1Median = d3.median(dim1Values);

            const halfRange = (dim1Max - dim1Min) / 2;
            const domainMin = dim1Median - halfRange;
            const domainMax = dim1Median + halfRange;

            const clusterWidth = monthWidths[i];
            const shift = shifts[month] || 0;

            const xRange = [cumulativeX + shift, cumulativeX + clusterWidth + shift];

            monthScales[month] = d3.scaleLinear()
                .domain([domainMin, domainMax])
                .range(xRange);

            cumulativeX += clusterWidth;
        }

        const simulation = d3
            .forceSimulation(slicedData)
            .force("x", d3.forceX(d => monthScales[d.Month](d["Dimension 1"])).strength(0.4))
            .force("y", d3.forceY(d => yScale(d.Month) + yScale.bandwidth() / 2).strength(0.4))
            .force("collide", d3.forceCollide(7.5))
            .stop();

        for (let i = 0; i < 500; i++) simulation.tick();

        const yAxisGroup = svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale).tickSize(0));

        yAxisGroup.selectAll("text")
            .attr("font-size", "14px")
            .attr("font-weight", "bold");
        yAxisGroup.select(".domain").remove();

        const circles = svg
            .selectAll("circle")
            .data(slicedData)
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 6)
            .style("cursor", "pointer")
            .on("click", (event, d) => this.handleTweetClick(d));

        this.updateCircleColors(circles);

        svg.append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

        this.drawLegend(svg, colorBy);
    }

    updateCircleColors(circles) {
        const colorScale = this.getColorScale();
        circles
            .transition()
            .duration(500)
            .attr("fill", d => {
                if (this.props.colorBy === "Sentiment") {
                    return colorScale(d[this.props.colorBy]);
                } else {
                    const val = d[this.props.colorBy];
                    const invertedVal = 1 - val;
                    return colorScale(invertedVal);
                }
            })
            .attr("stroke", d => this.state.selectedTweets.includes(d.idx) ? "black" : "none")
            .attr("stroke-width", 2);
    }

    drawLegend(svg, mode) {
        svg.select("#legend-gradient").remove();
        const legend = svg.select(".legend-group");
        legend.selectAll("text").remove();

        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "100%");

        let chosenColors;
        let topLabel;
        let bottomLabel;

        if (mode === "Sentiment") {
            chosenColors = this.sentimentColors;
            topLabel = "Positive";
            bottomLabel = "Negative";
        } else {
            chosenColors = this.subjectivityColors;
            topLabel = "Subjective";
            bottomLabel = "Objective";
        }

        const steps = chosenColors.length;
        const bandSize = 100 / steps;
        const stops = [];

        chosenColors.forEach((color, i) => {
            const start = i * bandSize;
            const end = (i + 1) * bandSize;
            stops.push({ offset: start + "%", color });
            stops.push({ offset: end + "%", color });
        });

        gradient.selectAll("stop")
            .data(stops)
            .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        legend.select("rect").remove();
        legend.append("rect")
            .attr("width", 20)
            .attr("height", 150)
            .style("fill", "url(#legend-gradient)");

        legend.append("text")
            .attr("x", 25)
            .attr("y", 10)
            .text(topLabel)
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

        legend.append("text")
            .attr("x", 25)
            .attr("y", 160)
            .text(bottomLabel)
            .attr("font-size", "12px")
            .attr("font-weight", "bold");
    }

    handleTweetClick = (tweet) => {
        const { selectedTweets } = this.state;
        const isSelected = selectedTweets.includes(tweet.idx);

        if (isSelected) {
            this.setState({
                selectedTweets: selectedTweets.filter(idx => idx !== tweet.idx)
            }, () => this.updateCircleColors(d3.select(this.svgRef.current).selectAll("circle")));
        } else {
            this.setState({
                selectedTweets: [...selectedTweets, tweet.idx]
            }, () => this.updateCircleColors(d3.select(this.svgRef.current).selectAll("circle")));
        }

        this.props.onTweetClick(tweet);
    }

    render() {
        return (
            <div>
                <svg ref={this.svgRef}></svg>
            </div>
        );
    }
}

export default Visualization;
