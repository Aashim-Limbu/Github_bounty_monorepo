// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract GitHubBountyDispenser is Ownable, ReentrancyGuard {
    // Storage
    mapping(uint256 => uint256) public bounties; // issueId => amount
    mapping(uint256 => mapping(address => bool)) public claimedBounties; // issueId => recipient => claimed

    // Errors
    error ZeroAddressNotAllowed();
    error BountyAlreadyExists(uint256 issueId);
    error InvalidBountyAmount();
    error NoBountyFound(uint256 issueId);
    error BountyAlreadyClaimed(uint256 issueId, address recipient);
    error EtherTransferFailed();

    // Events
    event BountyDeposited(uint256 indexed issueId, uint256 amount);
    event BountyCreated(uint256 indexed issueId, uint256 amount);
    event BountyReleased(uint256 indexed issueId, address indexed recipient, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) {
            revert ZeroAddressNotAllowed();
        }
    }

    receive() external payable {}

    /**
     * @notice Deposit ETH into contract without creating a bounty -- Fund the contract
     */
    function deposit() external payable {
        // Accepts ETH without creating a bounty
    }

    /**
     * @notice Create a new bounty for a GitHub issue
     * @param issueId The GitHub issue ID
     * @param amount The bounty amount in wei
     */
    function createBounty(uint256 issueId, uint256 amount) external onlyOwner nonReentrant {
        if (bounties[issueId] != 0) {
            revert BountyAlreadyExists(issueId);
        }
        if (amount == 0) {
            revert InvalidBountyAmount();
        }

        bounties[issueId] = amount;
        emit BountyCreated(issueId, amount);
    }

    /**
     * @notice Release bounty to a recipient
     * @param issueId The GitHub issue ID
     * @param recipient The address to receive the bounty
     */
    function releaseBounty(uint256 issueId, address recipient) external onlyOwner nonReentrant {
        if (bounties[issueId] == 0) {
            revert NoBountyFound(issueId);
        }
        if (claimedBounties[issueId][recipient]) {
            revert BountyAlreadyClaimed(issueId, recipient);
        }
        if (recipient == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        uint256 amount = bounties[issueId];
        bounties[issueId] = 0;
        claimedBounties[issueId][recipient] = true;

        (bool success,) = payable(recipient).call{value: amount}("");
        if (!success) {
            revert EtherTransferFailed();
        }

        emit BountyReleased(issueId, recipient, amount);
    }

    /**
     * @notice Emergency withdraw function for owner
     * @param amount The amount to withdraw in wei
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner nonReentrant {
        if (address(this).balance < amount) {
            revert InvalidBountyAmount();
        }

        (bool success,) = payable(owner()).call{value: amount}("");
        if (!success) {
            revert EtherTransferFailed();
        }

        emit EmergencyWithdraw(owner(), amount);
    }

    /**
     * @notice Get contract ETH balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Check if bounty exists for an issue
     * @param issueId The GitHub issue ID
     */
    function bountyExists(uint256 issueId) external view returns (bool) {
        return bounties[issueId] > 0;
    }
}
