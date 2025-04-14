import { 
  Box, 
  Flex, 
  Icon, 
  Text, 
  useColorModeValue, 
  Collapse,
} from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import { FiBriefcase, FiImage, FiHome, FiUserPlus, FiSettings, FiUsers, FiDollarSign, FiClock } from "react-icons/fi";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { TbPointFilled } from "react-icons/tb";
import { useEffect, useState } from "react";

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiBriefcase, title: "હરિભાગત ની યાદી", path: "/haribhagat" },
  { icon: FiImage, title: "યાદી ફોટા સાથે", path: "/haribhagat-photo" },
  { icon: FiDollarSign, title: "સહજાનંદ સભા", path: "/monthly-donor" },
  { icon: FiClock, title: "જન્મદિવસ ની યાદી", path: "/birthday-list" },
  { icon: FiUserPlus, title: "સભા ", path: "/sabhadata" },
  { icon: FiSettings, title: "યૂઝર સેટિંગ્સ", path: "/settings" },
];

interface SidebarItemsProps {
  onClose?: () => void;
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const textColor = useColorModeValue("ui.main", "ui.light");
  const bgActive = useColorModeValue("#E2E8F0", "#4A5568");
  const [isOpen, setIsOpen] = useState(false);
  const role = localStorage.getItem("user_role");

  const finalItems = role === "admin"
    ? [...items, { icon: FiBriefcase, title: "વેરિફાઇડ", path: "/haribhagatarecored" }, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : role === "sub-user"
    ? [
        { icon: FiBriefcase, title: "હરિભાગત ની યાદી", path: "/haribhagat" },
        { icon: FiBriefcase, title: "હાજરી પત્રક", path: "/Attendance" }
      ]
    : items;

  useEffect(() => {
    // Close collapse if the location changes (except for the haribhagat section)
    if (
      location.pathname !== "/haribhagat" ||
      (location.pathname === "/haribhagat" && !location.search) ||
      location.search === "?gender=Male" ||
      location.search === "?gender=Female"
    ) {
      setIsOpen(true);
    } else {
      setIsOpen(false); // Close the dropdown when moving away from the "હરિભારત ની યાદી" page
    }
  }, [location]); // Dependency on location to trigger the effect on route change

  const handleMenuClick = () => {
    setIsOpen((prevState) => !prevState); // Toggle `isOpen`
  };

  const closeDropdown = () => {
    setIsOpen(false); // Close `હરિભાગત ની યાદી`
  };

  const listItems = finalItems.map(({ icon, title, path }) => {
    if (title === "હરિભાગત ની યાદી") {
      return (
        <Box key={title}>
          <Flex
            w="100%"
            p={2}
            onClick={handleMenuClick}
            justify="space-between"
            align="center"
            color={textColor}
          >
            <Flex align="center">
              <Icon as={icon} />
              <Text ml={2}>{title}</Text>
            </Flex>
            <ChevronDownIcon transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"} />
          </Flex>
    
          <Collapse in={isOpen}>
            <Box pl={4}>
              <Flex
                as={Link}
                to="/haribhagat"
                w="100%"
                p={2}
                style={{
                  background: location.pathname === "/haribhagat" && !location.search ? bgActive : "transparent",
                  borderRadius: "12px",
                }}
                color={textColor}
                _hover={{ background: bgActive }}
                onClick={onClose}
              >
                <TbPointFilled size={20} />
                <Text ml={1}>બધી યાદી</Text>
              </Flex>
    
              <Flex
                as={Link}
                to="/haribhagat?gender=Male"
                w="100%"
                p={2}
                style={{
                  background: location.search === "?gender=Male" ? bgActive : "transparent",
                  borderRadius: "12px",
                }}
                color={textColor}
                _hover={{ background: bgActive }}
                onClick={onClose}
              >
                <TbPointFilled size={20} />
                <Text>પુરૂષ ની યાદી</Text>
              </Flex>
    
              <Flex
                as={Link}
                to="/haribhagat?gender=Female"
                w="100%"
                p={2}
                style={{
                  background: location.search === "?gender=Female" ? bgActive : "transparent",
                  borderRadius: "12px",
                }}
                color={textColor}
                _hover={{ background: bgActive }}
                onClick={onClose}
              >
                <TbPointFilled size={20} />
                <Text>મહિલા ની યાદી</Text>
              </Flex>
            </Box>
          </Collapse>
        </Box>
      );
    }

    return (
      <Flex
        as={Link}
        to={path}
        w="100%"
        p={2}
        key={title}
        activeProps={{
          style: {
            background: bgActive,
            borderRadius: "12px",
          },
        }}
        color={textColor}
        onClick={closeDropdown}
      >
        <Icon as={icon} alignSelf="center" />
        <Text ml={2}>{title}</Text>
      </Flex>
    );
  });

  return <Box>{listItems}</Box>;
};

export default SidebarItems;
