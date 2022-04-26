//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

error InvalidDate();
error DuplicateDates();
error UnorderedDates();

library DatesChecker {
    function validateDates(string[] memory dates) internal pure {
        bytes32 maxDateHash = keccak256("");
        for (uint256 i = 0; i < dates.length; i++) {
            // check date format
            checkDate(dates[i]);

            // check duplicate dates
            bytes32 dateHash = keccak256(abi.encodePacked(dates[i]));
            if (i == 0 || maxDateHash < dateHash) {
                maxDateHash = dateHash;
            } else if (maxDateHash == dateHash) {
                revert DuplicateDates();
            } else {
                revert UnorderedDates();
            }
        }
    }

    function checkDate(string memory date)
        internal
        pure
    {
        bytes memory b = bytes(date);
        if (b.length != 10 || b[4] != 0x2d || b[7] != 0x2d) {
            revert InvalidDate();
        }
        uint16 year = getNumberFromStringBytes(b, 0, 4);
        uint16 month = getNumberFromStringBytes(b, 5, 7);
        uint16 day = getNumberFromStringBytes(b, 8, 10);
        if (month < 1 || month > 12) {
            revert InvalidDate();
        }
        uint8 maxDays;
        if (month == 2) {
            if (checkLeapYear(year)) {
                maxDays = 29;
            } else {
                maxDays = 28;
            }
        } else if (month <= 7) {
            maxDays = uint8(30 + (month % 2));
        } else {
            maxDays = uint8(31 - (month % 2));
        }
        if (day < 1 || day > maxDays) {
            revert InvalidDate();
        }
    }

    function checkLeapYear(uint16 year) internal pure returns (bool) {
        return (year % 400 == 0) || (year % 4 == 0 && year % 100 != 0);
    }

    function getNumberFromStringBytes(
        bytes memory b,
        uint256 start,
        uint256 end
    ) internal pure returns (uint16 number) {
        for (uint256 i = start; i < end; i++) {
            if (!(b[i] >= 0x30 && b[i] <= 0x39)) {
            revert InvalidDate();
            }
            number += uint16((uint8(b[i]) - 0x30) * 10**(end - 1 - i));
        }
    }
}
