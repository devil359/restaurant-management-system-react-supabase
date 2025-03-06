
import MenuGrid from "@/components/Menu/MenuGrid";

const Menu = () => {
  return (
    <div className="p-6 rounded-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Restaurant Menu
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your restaurant's menu items
        </p>
      </div>
      <MenuGrid />
    </div>
  );
};

export default Menu;
