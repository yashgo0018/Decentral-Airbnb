//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./DatesChecker.sol";
import "./IWETH.sol";

error DateUnavailable();
error IncorrectPayment();
error RentalNotFound();

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

    event NewDatesBooked(
        string[] datesBooked,
        uint256 id,
        address booker,
        string city,
        string imgUrl
    );

    IWETH public weth;

    mapping(uint256 => RentalInfo) public rentals;
    uint256[] public rentalIds;
    mapping(uint256 => mapping(string => bool)) public bookings;

    constructor(IWETH _weth) {
        weth = _weth;
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
            if (bookings[id][newBookings[i]]) revert DateUnavailable();
            bookings[id][newBookings[i]] = true;
        }
    }

    function addDatesBooked(uint256 id, string[] memory newBookings)
        external
        payable
    {
        if (id >= _rentalCounter.current()) revert RentalNotFound();
        uint256 amount = rentals[id].pricePerDay * newBookings.length;
        if (msg.value != amount) revert IncorrectPayment();
        _addBookings(id, newBookings);
        RentalInfo memory rental = rentals[id];
        _safeTransferETHWithFallback(rental.renter, amount);
        emit NewDatesBooked(
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
            weth.deposit{value: amount}();
            require(weth.transfer(to, amount), "transfer failed");
        }
    }

    function _safeTransferETH(address to, uint256 value)
        internal
        returns (bool)
    {
        // solhint-disable-next-line
        (bool success, ) = to.call{value: value, gas: 30_000}("");
        return success;
    }
}
