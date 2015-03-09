using IndoorNavigation.Domain.Implementations;
using IndoorNavigation.Domain.ModelClasses;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace IndoorNavigation.Interface.Controllers
{
    public class MyController : Controller
    {
        //
        // GET: /My/
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Building()
        {
            ViewData["myListStart"] = GetMarkers();
            ViewData["myListEnd"] = GetMarkers();
                //new SelectList(new[] { "10", "15", "25", "50", "100", "1000" }
                //.Select(x => new { value = x, text = x }),
                //"value", "text", "15");
            return View("VirtualBuilding");

            //var model = new ComboBoxModel
            //{
            //    Markers = GetMarkers()
            //};
            //return View(model);
        }

        private IEnumerable<SelectListItem> GetMarkers()
        {
            var repo = new EFRepository();

            List<Marker> markers = repo.Markers.ToList<Marker>();
            foreach (Marker m in markers)
            {
                m.FillMarker();
            }

            var _markers = markers.Select(x =>
                new SelectListItem
                {
                    Value = x.Id.ToString(),
                    Text = x.Description
                });

            return new SelectList(_markers, "Value", "Text");
        }
    }

    public class ComboBoxModel
    {
        [Display(Name = "Marker ID")] 
        public int SelectedMarkerId { get; set; }
        public IEnumerable<SelectListItem> Markers { get; set; }
    }

    
}
