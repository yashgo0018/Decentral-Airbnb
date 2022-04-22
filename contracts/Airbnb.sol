//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./DatesChecker.sol";
import "./IWETH.sol";

contract Airbnb is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _rentalCounter;

    struct RentalInfo {
        string name;
        string city;
        string lat;
        string long;
        string unoDescription;
        string dosDescription;
        string imgUrl;
        uint256 maxGuests;
        uint256 pricePerDay;
        uint256 id;
        address renter;
    }

    event RentalCreated(
        string name,
        string city,
        string lat,
        string long,
        string unoDescription,
        string dosDescription,
        string imgUrl,
        uint256 maxGuests,
        uint256 pricePerDay,
        string[] datesBooked,
        uint256 id,
        address renter
    );

    event newDatesBooked(
        string[] datesBooked,
        uint256 id,
        address booker,
        string city,
        string imgUrl
    );

    IWETH public WETH;

    mapping(uint256 => RentalInfo) public rentals;
    uint256[] public rentalIds;
    mapping(uint256 => mapping(string => bool)) public bookings;

    constructor(IWETH _WETH) {
        WETH = _WETH;
    }

    function createRental(
        string memory name,
        string memory city,
        string memory lat,
        string memory long,
        string memory unoDescription,
        string memory dosDescription,
        string memory imgUrl,
        uint256 maxGuests,
        uint256 pricePerDay,
        string[] memory datesBooked
    ) external onlyOwner {
        uint256 rentalId = _rentalCounter.current();
        _rentalCounter.increment();
        RentalInfo storage newRental = rentals[rentalId];
        newRental.name = name;
        newRental.city = city;
        newRental.lat = lat;
        newRental.long = long;
        newRental.unoDescription = unoDescription;
        newRental.dosDescription = dosDescription;
        newRental.imgUrl = imgUrl;
        newRental.maxGuests = maxGuests;
        newRental.pricePerDay = pricePerDay;
        newRental.id = rentalId;
        newRental.renter = msg.sender;
        _addBookings(rentalId, datesBooked);
        emit RentalCreated(
            name,
            city,
            lat,
            long,
            unoDescription,
            dosDescription,
            imgUrl,
            maxGuests,
            pricePerDay,
            datesBooked,
            rentalId,
            msg.sender
        );
    }

    function _addBookings(uint256 id, string[] memory newBookings) internal {
        DatesChecker.validateDates(newBookings);
        for (uint256 i = 0; i < newBookings.length; i++) {
            require(
                !bookings[id][newBookings[i]],
                "Already Booked For Requested Date"
            );
            bookings[id][newBookings[i]] = true;
        }
    }

    function addDatesBooked(uint256 id, string[] memory newBookings)
        external
        payable
    {
        require(id < _rentalCounter.current(), "No such Rental");
        uint256 amount = rentals[id].pricePerDay * 1 ether * newBookings.length;
        require(
            msg.value == amount,
            "Please submit the asking price in order to complete the purchase"
        );
        _addBookings(id, newBookings);
        RentalInfo memory rental = rentals[id];
        _safeTransferETHWithFallback(rental.renter, amount);
        emit newDatesBooked(
            newBookings,
            id,
            msg.sender,
            rental.city,
            rental.imgUrl
        );
    }

    function getTotalRentals() external view returns (uint256) {
        return _rentalCounter.current();
    }

    function _safeTransferETHWithFallback(address to, uint256 amount) internal {
        if (!_safeTransferETH(to, amount)) {
            WETH.deposit{value: amount}();
            require(WETH.transfer(to, amount), "transfer failed");
        }
    }

    function _safeTransferETH(address to, uint256 value)
        internal
        returns (bool)
    {
        (bool success, ) = to.call{value: value, gas: 30_000}(new bytes(0));
        return success;
    }
}
