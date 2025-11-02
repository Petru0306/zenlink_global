/*!

=========================================================
* Vision UI Free React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-free-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)
* Licensed under MIT (https://github.com/creativetimofficial/vision-ui-free-react/blob/master LICENSE.md)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import React, { Component } from "react";
import Chart from "react-apexcharts";

class BarChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartData: [],
      chartOptions: {},
    };
  }

  componentDidMount() {
    const { barChartData, barChartOptions } = this.props;

    this.setState({
      chartData: barChartData || [],
      chartOptions: barChartOptions || {},
    });
  }

  render() {
    const { barChartData, barChartOptions } = this.props;
    const { chartData, chartOptions } = this.state;
    
    // Use props if state is not ready, but ensure data is valid
    const dataToUse = chartData && chartData.length > 0 ? chartData : (barChartData || []);
    const optionsToUse = Object.keys(chartOptions).length > 0 ? chartOptions : (barChartOptions || {});
    
    if (!dataToUse || !Array.isArray(dataToUse) || dataToUse.length === 0) {
      return null;
    }

    return (
      <Chart
        options={optionsToUse}
        series={dataToUse}
        type="bar"
        width="100%"
        height="100%"
      />
    );
  }
}

export default BarChart;
