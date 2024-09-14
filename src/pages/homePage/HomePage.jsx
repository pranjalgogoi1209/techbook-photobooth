import React from "react";
import "./homePage.scss";

import Model3d from "../../components/model3d/Model3d";
import Header from "../../components/header/Header";

export default function HomePage() {
  return (
    <div className="HomePage flex-col-center">
      <Header />
      {/* <Model3d /> */}
      <div className="start_button">
        <button className="flex-row-center">
          <img src="/start.png" alt="" />
        </button>
      </div>
    </div>
  );
}
