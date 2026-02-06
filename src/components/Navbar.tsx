import { Container } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="navbar bg-primary shadow-2xl  items-center wrap  shadow-lg flex justify-content md:justify-between px-4">
      <div className="navbar-start">
        <a href="#" className="flex items-center gap-2 text-primary-content font-bold text-2xl md:text-xl">
          <Container size={24} />
          LUC<span className="text-accent">DEV</span>
        </a>
        <ul 
        className=" justify-right flex wrap md:flex space-x-4">
          <li
          className="btn text-xl text-white btn-sm btn-ghost"
          >
            Acceuil
            </li>
            <li
          className="btn text-xl text-white btn-sm btn-ghost"
          >
            A Propos
            </li>
            <li
          className="btn text-xl text-white btn-sm btn-ghost"
          >
            Mes experiences
            </li>
            <li
          className="btn text-xl text-white btn-sm btn-ghost"
          >
            Mes Projets
            </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;