using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using IndoorNavigation.Domain.Interfaces;
using IndoorNavigation.Domain.Implementations;
using IndoorNavigation.Domain.ModelClasses;
using IndoorNavigation.Interface.Models;

namespace IndoorNavigation.Interface.Controllers
{
    public class HomeController : Controller
    {
        private IRepository repo;
        public int pageSize = 8;

        public HomeController(IRepository repository)
        {
            this.repo = repository;
        }
        
        public HomeController()
        {
            this.repo = new EFRepository();
        }

        public ActionResult Index()
        {
            ViewBag.Message = "Modify this template to jump-start your ASP.NET MVC application.";
            EFRepository repo = new EFRepository();
            Marker m1 = repo.Markers.First();
            //Point p1 = repo.Points.First();
            m1.FillMarker();
            //ViewBag.Point = p1.Description;
            return View(m1);
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your app description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        /*для отображения списка всех маркеров*/
        public ViewResult GetAllMarkers(int page = 1)
        {
            Marker[] Markers = repo.Markers.ToArray();
            foreach (Marker m in Markers)
            {
                m.FillMarker();
            }
            MarkersListViewModel model = new MarkersListViewModel()
            {
                Markers = Markers.OrderBy(m => m.Id).Skip((page - 1) * pageSize).Take(pageSize),
                PagingInfo = new PagingInfo
                {
                    CurrentPage = page,
                    ItemsPerPage = pageSize,
                    TotalItems = repo.Markers.Count()
                }
            };
            return View(model);
        }

        /*Для первоначального открытия страницы первого этапа поиска*/
        [HttpGet]
        public ViewResult Search1() 
        {
            List<Marker> markers = repo.Markers.ToList<Marker>();
            foreach (Marker m in markers)
            {
                m.FillMarker();
            }
            return View(markers);
        }
        
        /*для обработки нажатия кнопки при выборе маркера перед поиском (для повторного открытия
         * страницы первого этапа поиска).
         перенаправляет на метод отображения результатов поиска. */
        [HttpPost]
        public RedirectToRouteResult Search1(Marker startMar, Marker finishMar)
        {
            TempData["start"] = startMar.Id;
            TempData["finish"] = finishMar.Id;
            return RedirectToAction("GetRoute");
        }

        /*Для первоначального открытия страницы второго этапа поиска*/
        [HttpGet]
        public ViewResult Search2()
        {
            return View();
        }

        /*Для открытия страницы второго этапа поиска в ответ на отправку формы*/
        [HttpPost]
        public ViewResult Search2(Marker finishMar, int port) 
        {
            MarkerWithPort m1 = new MarkerWithPort() { finishMar = finishMar, port = port };
            return View(m1);
        }

        /*для выдачи результата второго этапа поиска*/
        public JsonResult Search2Json(Marker finishMar, int port)
        {
            Marker linkedMar = finishMar.Device.Neighbours[port].Markers.First();
            var data1 =  new
            {
                Id = linkedMar.Id, X = linkedMar.X, Y = linkedMar.Y, Z = linkedMar.Z,
                Description = linkedMar.Description, DeviceId = linkedMar.DeviceId,
                ImageData = linkedMar.ImageData,
                Device = (linkedMar.Device != null) ? new { Description = linkedMar.Device.Description, Type = linkedMar.Device.Type } : null,
                Neighbours = linkedMar.Neighbours.Select(t => new
                {
                    Id = t.Key.Id
                })
            };
            var data2 = new
            {
                Id = finishMar.Id, X = finishMar.X, Y = finishMar.Y, Z = finishMar.Z,
                Description = finishMar.Description, DeviceId = finishMar.DeviceId,
                ImageData = finishMar.ImageData,
                Device = (finishMar.Device != null) ? new { Description = finishMar.Device.Description, Type = finishMar.Device.Type } : null,
                Neighbours = finishMar.Neighbours.Select(t => new
                {
                    Id = t.Key.Id
                })
            };
            var data = new { finishMar = data2, linkedMar = data1 }; 
            return Json(data, JsonRequestBehavior.AllowGet);
        }
        
        /*для передачи кратчайшего пути с помещением и устройствами в формате json. */
        public JsonResult GetRoute(int start, int finish)
        {
            List<Marker> markers = repo.Markers.ToList<Marker>();
            ShortestPath p1 = new ShortestPath();
            p1.FillVertices(markers);
            p1.FillEdges(markers);
            Marker m1 = markers.Where(p => p.Id == start).First();
            Marker m2 = markers.Where(p => p.Id == finish).First();
            m1.FillMarker();
            m2.FillMarker();
            foreach (Marker m in markers)
            {
                m.FillMarker();
                if (m.Device != null)
                    m.Device.FillPorts();
            }
            Marker[] route = p1.BuildingPath(m1, m2, markers).ToArray();
            var data = route.Select(p => new {
                Id = p.Id, X = p.X, Y = p.Y, Z = p.Z, Description = p.Description, DeviceId = p.DeviceId,
                ImageData = p.ImageData,
                Device = (p.Device != null) ? new { Description = p.Device.Description, Type = p.Device.Type } : null,
                Neighbours = p.Neighbours.Select(t => new
                {
                    Id = t.Key.Id
                })
            });
            return Json(data, JsonRequestBehavior.AllowGet);
        }
        
        //выдаёт помещение с маркерами в формате json. для страницы простого просмотра помещения
        /*нужно на клиенте писать js функцию для получения результата метода*/
        public JsonResult GetRoomWithMarkers()
        {
            RoomWithMarkers data3 = new RoomWithMarkers();
            data3.markers = repo.Markers.ToArray();
            data3.points = repo.Points.ToArray();
            foreach (Marker m in data3.markers)
            {
                m.FillMarker();
                if (m.Device != null)
                  m.Device.FillPorts();
            }
            foreach (Point p in data3.points)
            {
                p.FillNeighbours();
            }
            var data1 = data3.markers.Select(p => new
            {
                Id = p.Id, X = p.X, Y = p.Y, Z = p.Z, Description = p.Description, DeviceId = p.DeviceId,
                ImageData = p.ImageData,
                Device = (p.Device != null) ? new { Description = p.Device.Description, Type = p.Device.Type } : null,
                Neighbours = p.Neighbours.Select(t => new
                {
                    Id = t.Key.Id  //X = t.Key.X,//Y = t.Key.Y,//Z = t.Key.Z,//Description = t.Key.Description,
                    //Device = (t.Key.Device != null) ? new { Description = t.Key.Device.Description, Type = t.Key.Device.Type } : null,
                    //DeviceId = t.Key.DeviceId,
                    //ImageData = t.Key.ImageData,
                    //Distance = t.Value
                }),
            });
            var data2 = data3.points.Select(p=>new
            { 
                Id = p.Id, Description = p.Description, X=p.X, Y=p.Y, Z=p.Z,
                Neighbours = p.Neighbours.Select(t => new
                {
                    Id = t.Id
                })
            });
            var data = new { markers = data1, points = data2 };
            return Json(data, JsonRequestBehavior.AllowGet);
        }
    }
}
