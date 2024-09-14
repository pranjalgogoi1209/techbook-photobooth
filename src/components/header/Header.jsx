import React from 'react';
import './header.scss';
import logo from '/logo.png';

function Header() {
  return (
    <div className='Header flex-col-center'>
      <div className="image_container flex-row-center">
        <img src={logo} alt="logo" />
      </div>
    </div>
  )
}

export default Header;