// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./1_SimpleStorage.sol";

contract ExtraStorage is SimpleStorage {
    function store(uint256 _favoriteNumber) public virtual override {
        favoriteNumber = _favoriteNumber + 5;
    }
}