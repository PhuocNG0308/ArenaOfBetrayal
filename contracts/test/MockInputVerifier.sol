// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.20;

contract MockInputVerifier {
    function verify(address user, bytes calldata inputProof) external pure returns (uint256[] memory) {
        // For testing, we encode the expected number of handles in the inputProof
        // inputProof should be abi.encode(uint256 count)
        if (inputProof.length >= 32) {
            uint256 count = abi.decode(inputProof, (uint256));
            uint256[] memory handles = new uint256[](count);
            for(uint256 i=0; i<count; i++) {
                // Generate pseudo-random handles
                handles[i] = uint256(keccak256(abi.encodePacked(user, i)));
            }
            return handles;
        }
        return new uint256[](0);
    }
}
