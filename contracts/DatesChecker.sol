//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library DatesChecker {
    function validateDates(string[] memory dates) internal pure {
        bytes32 maxDateHash = keccak256("");
        for (uint256 i = 0; i < dates.length; i++) {
            // check date format
            checkDate(dates[i], "invalid date found");

            // check duplicate dates
            bytes32 dateHash = keccak256(abi.encodePacked(dates[i]));
            if (i == 0 || maxDateHash < dateHash) {
                maxDateHash = dateHash;
            } else if (maxDateHash == dateHash) {
                revert("duplicate dates found");
            } else {
                revert(
                    "dates should be arranged in the assending order of their hashes"
                );
            }
        }
    }

    function checkDate(string memory date, string memory errorMessage)
        internal
        pure
    {
        bytes memory b = bytes(date);
        uint256 l = b.length;
        if (l != 10 || b[4] != 0x2d || b[7] != 0x2d) {
            revert(errorMessage);
        }
        uint16 year = getNumberFromStringBytes(b, 0, 4, errorMessage);
        uint16 month = getNumberFromStringBytes(b, 5, 7, errorMessage);
        uint16 day = getNumberFromStringBytes(b, 8, 10, errorMessage);
        if (month < 1 || month > 12) {
            revert(errorMessage);
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
            revert(errorMessage);
        }
    }

    function checkLeapYear(uint16 year) internal pure returns (bool) {
        return (year % 400 == 0) || (year % 4 == 0 && year % 100 != 0);
    }

    function getNumberFromStringBytes(
        bytes memory b,
        uint256 start,
        uint256 end,
        string memory errorMessage
    ) internal pure returns (uint16 number) {
        for (uint256 i = start; i < end; i++) {
            if (!(b[i] >= 0x30 && b[i] <= 0x39)) {
                revert(errorMessage);
            }
            number += uint16((uint8(b[i]) - 0x30) * 10**(end - 1 - i));
        }
    }
}
